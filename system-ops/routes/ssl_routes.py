"""
SSL Routes
Endpoints para gerenciamento de certificados SSL
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import uuid

from database.connection import get_db
from database.models import SslCertificate as DbSslCertificate, CertificateStatus
from services.ssl_service import SSLService
from models.ssl import SSLRequest, SSLRenewal, SSLInstallation, SSLProvider, SSLChallenge, SSLKeyType

logger = logging.getLogger(__name__)
router = APIRouter(tags=["SSL"])


@router.post("/issue")
async def issue_certificate(
    request: SSLRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Emite um novo certificado SSL via ACME ou gera auto-assinado"""
    try:
        logger.info(f"📝 Solicitação para emitir certificado SSL para {request.domains}")

        # Chamar serviço SSL primeiro
        ssl_service = SSLService()
        result = await ssl_service.generate_certificate(request)

        if not result.get("success"):
            raise Exception(result.get("message", "Falha ao gerar certificado"))

        # Procurar domínio pelo nome (primaryDomain)
        from database.models import Domain
        domain = db.query(Domain).filter(Domain.name == request.domains[0]).first()

        if not domain:
            raise HTTPException(
                status_code=404,
                detail=f"Domínio '{request.domains[0]}' não encontrado. Crie o domínio primeiro."
            )

        # Criar registro no banco com resultado
        db_certificate = DbSslCertificate(
            id=uuid.uuid4(),
            primaryDomain=request.domains[0],
            sanDomains=",".join(request.domains[1:]) if len(request.domains) > 1 else None,
            status="valid",
            certificatePath=result.get("certificate_path"),
            privateKeyPath=result.get("private_key_path"),
            autoRenew=True if request.provider == SSLProvider.LETSENCRYPT else False,
            domainId=domain.id
        )

        # Calcular data de expiração
        if request.provider == SSLProvider.LETSENCRYPT:
            from datetime import timedelta
            db_certificate.expiresAt = datetime.now() + timedelta(days=90)
            db_certificate.issuer = "Let's Encrypt"
        elif request.provider == SSLProvider.SELF_SIGNED:
            from datetime import timedelta
            db_certificate.expiresAt = datetime.now() + timedelta(days=365)
            db_certificate.issuer = "Self-Signed"

        db.add(db_certificate)
        db.commit()
        db.refresh(db_certificate)

        return {
            "success": True,
            "certificate_id": str(db_certificate.id),
            "domains": request.domains,
            "provider": request.provider.value,
            "certificate_path": result.get("certificate_path"),
            "message": result.get("message")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao emitir certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/renew")
async def renew_certificate(
    request: SSLRenewal,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Renova um certificado SSL existente"""
    try:
        logger.info(f"🔄 Solicitação para renovar certificado")

        ssl_service = SSLService()
        result = await ssl_service.renew_certificate(request)

        # Atualizar registro no banco se temos certificate_id
        if request.certificate_id:
            db_certificate = db.query(DbSslCertificate).filter(
                DbSslCertificate.id == uuid.UUID(request.certificate_id)
            ).first()

            if db_certificate:
                if result.get("success"):
                    db_certificate.status = "valid"
                    from datetime import timedelta
                    db_certificate.expiresAt = datetime.now() + timedelta(days=90)
                    db_certificate.lastError = None
                else:
                    db_certificate.status = "failed"
                    db_certificate.lastError = result.get("error")

                db.commit()

        return result

    except Exception as e:
        logger.error(f"❌ Erro ao renovar certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_certificates(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Lista todos os certificados SSL do banco de dados"""
    try:
        certificates = db.query(DbSslCertificate).all()

        return [{
            "id": str(cert.id),
            "primaryDomain": cert.primaryDomain,
            "sanDomains": cert.sanDomains,
            "status": cert.status,
            "issuer": cert.issuer,
            "certificatePath": cert.certificatePath,
            "privateKeyPath": cert.privateKeyPath,
            "expiresAt": cert.expiresAt.isoformat() if cert.expiresAt else None,
            "autoRenew": cert.autoRenew,
            "renewBeforeDays": cert.renewBeforeDays,
            "lastError": cert.lastError,
            "createdAt": cert.createdAt.isoformat() if cert.createdAt else None,
            "updatedAt": cert.updatedAt.isoformat() if cert.updatedAt else None
        } for cert in certificates]

    except Exception as e:
        logger.error(f"❌ Erro ao listar certificados: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{certificate_id}")
async def get_certificate_info(
    certificate_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Obtém informações detalhadas de um certificado"""
    try:
        # Buscar no banco
        db_certificate = db.query(DbSslCertificate).filter(
            DbSslCertificate.id == uuid.UUID(certificate_id)
        ).first()

        if not db_certificate:
            raise HTTPException(status_code=404, detail="Certificado não encontrado")

        # Obter info detalhada do arquivo
        ssl_service = SSLService()
        if db_certificate.certificatePath:
            cert_info = await ssl_service.get_certificate_info(db_certificate.certificatePath)

            return {
                "id": str(db_certificate.id),
                "primaryDomain": db_certificate.primaryDomain,
                "sanDomains": db_certificate.sanDomains,
                "status": db_certificate.status,
                "autoRenew": db_certificate.autoRenew,
                "renewBeforeDays": db_certificate.renewBeforeDays,
                "certificatePath": db_certificate.certificatePath,
                "privateKeyPath": db_certificate.privateKeyPath,
                "expiresAt": db_certificate.expiresAt.isoformat() if db_certificate.expiresAt else None,
                "lastError": db_certificate.lastError,
                # Informações do arquivo
                "subject": cert_info.subject,
                "issuer": cert_info.issuer,
                "serialNumber": cert_info.serial_number,
                "signatureAlgorithm": cert_info.signature_algorithm,
                "keySize": cert_info.key_size,
                "fingerprintSha1": cert_info.fingerprint_sha1,
                "fingerprintSha256": cert_info.fingerprint_sha256,
                "isValid": cert_info.is_valid,
                "isExpired": cert_info.is_expired,
                "daysUntilExpiry": cert_info.days_until_expiry,
                "isSelfSigned": cert_info.is_self_signed
            }
        else:
            # Retornar apenas dados do banco
            return {
                "id": str(db_certificate.id),
                "primaryDomain": db_certificate.primaryDomain,
                "sanDomains": db_certificate.sanDomains,
                "status": db_certificate.status,
                "issuer": db_certificate.issuer,
                "autoRenew": db_certificate.autoRenew,
                "renewBeforeDays": db_certificate.renewBeforeDays,
                "lastError": db_certificate.lastError
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao obter informações do certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/install")
async def install_certificate(
    request: SSLInstallation,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Instala certificado nos serviços (Nginx, Apache, etc)"""
    try:
        logger.info(f"📦 Instalando certificado {request.certificate_id}")

        ssl_service = SSLService()
        result = await ssl_service.install_certificate(request)

        return result

    except Exception as e:
        logger.error(f"❌ Erro ao instalar certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{certificate_id}")
async def delete_certificate(
    certificate_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Deleta um certificado do banco de dados"""
    try:
        db_certificate = db.query(DbSslCertificate).filter(
            DbSslCertificate.id == uuid.UUID(certificate_id)
        ).first()

        if not db_certificate:
            raise HTTPException(status_code=404, detail="Certificado não encontrado")

        db.delete(db_certificate)
        db.commit()

        return {
            "success": True,
            "message": f"Certificado {certificate_id} deletado com sucesso"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao deletar certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

"""
SQLAlchemy Models for NetPilot Database
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from .connection import Base


class CertificateStatus(str, enum.Enum):
    """SSL Certificate Status"""
    PENDING = "pending"
    VALID = "valid"
    EXPIRED = "expired"
    EXPIRING = "expiring"
    FAILED = "failed"


class Domain(Base):
    """Domain entity"""
    __tablename__ = "domains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    isActive = Column("isActive", Boolean, default=True)
    isLocked = Column("isLocked", Boolean, default=False)
    autoTls = Column("autoTls", Boolean, default=True)
    forceHttps = Column("forceHttps", Boolean, default=True)
    blockExternalAccess = Column("blockExternalAccess", Boolean, default=False)
    enableWwwRedirect = Column("enableWwwRedirect", Boolean, default=False)
    bindIp = Column("bindIp", String, nullable=True)
    projectId = Column("projectId", UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    createdAt = Column("createdAt", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column("updatedAt", DateTime(timezone=True), onupdate=func.now())

    # Relationships
    proxyRules = relationship("ProxyRule", back_populates="domain", lazy="joined")


class ProxyRule(Base):
    """Proxy Rule entity"""
    __tablename__ = "proxy_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sourcePath = Column("sourcePath", String, nullable=False)
    sourcePort = Column("sourcePort", Integer, nullable=True)
    targetUrl = Column("targetUrl", String, nullable=False)
    priority = Column(Integer, default=1)
    isActive = Column("isActive", Boolean, default=True)
    isLocked = Column("isLocked", Boolean, default=False)
    maintainQueryStrings = Column("maintainQueryStrings", Boolean, default=True)
    description = Column(Text, nullable=True)
    domainId = Column("domainId", UUID(as_uuid=True), ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column("createdAt", DateTime(timezone=True), server_default=func.now())
    updatedAt = Column("updatedAt", DateTime(timezone=True), onupdate=func.now())

    # Relationships
    domain = relationship("Domain", back_populates="proxyRules")


class SslCertificate(Base):
    """SSL Certificate entity"""
    __tablename__ = "ssl_certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    primaryDomain = Column("primaryDomain", String, nullable=False)
    sanDomains = Column("sanDomains", Text, nullable=True)
    status = Column(String, default="pending", nullable=False)
    expiresAt = Column("expiresAt", DateTime(timezone=False), nullable=True)
    autoRenew = Column("autoRenew", Boolean, default=True, nullable=False)
    renewBeforeDays = Column("renewBeforeDays", Integer, default=30, nullable=False)
    certificatePath = Column("certificatePath", String, nullable=True)
    privateKeyPath = Column("privateKeyPath", String, nullable=True)
    issuer = Column("issuer", String, nullable=True)
    lastError = Column("lastError", Text, nullable=True)
    domainId = Column("domainId", UUID(as_uuid=True), ForeignKey("domains.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column("createdAt", DateTime(timezone=False), server_default=func.now(), nullable=False)
    updatedAt = Column("updatedAt", DateTime(timezone=False), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    domain = relationship("Domain")

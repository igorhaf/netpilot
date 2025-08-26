// Ziggy route helper
const Ziggy = {
    url: 'http://localhost',
    port: null,
    defaults: {},
    routes: {
        'dashboard': { uri: '', methods: ['GET', 'HEAD'] },

        // Domains routes
        'domains.index': { uri: 'domains', methods: ['GET', 'HEAD'] },
        'domains.create': { uri: 'domains/create', methods: ['GET', 'HEAD'] },
        'domains.store': { uri: 'domains', methods: ['POST'] },
        'domains.edit': { uri: 'domains/{domain}/edit', methods: ['GET', 'HEAD'] },
        'domains.update': { uri: 'domains/{domain}', methods: ['PUT', 'PATCH'] },
        'domains.destroy': { uri: 'domains/{domain}', methods: ['DELETE'] },

        // Proxy routes
        'proxy.index': { uri: 'proxy', methods: ['GET', 'HEAD'] },
        'proxy.create': { uri: 'proxy/create', methods: ['GET', 'HEAD'] },
        'proxy.store': { uri: 'proxy', methods: ['POST'] },
        'proxy.edit': { uri: 'proxy/{proxyRule}/edit', methods: ['GET', 'HEAD'] },
        'proxy.update': { uri: 'proxy/{proxyRule}', methods: ['PUT', 'PATCH'] },
        'proxy.destroy': { uri: 'proxy/{proxyRule}', methods: ['DELETE'] },
        'proxy.toggle': { uri: 'proxy/{proxyRule}/toggle', methods: ['POST'] },
        'proxy.deploy': { uri: 'proxy/deploy', methods: ['POST'] },

        // SSL routes
        'ssl.index': { uri: 'ssl', methods: ['GET', 'HEAD'] },
        'ssl.create': { uri: 'ssl/create', methods: ['GET', 'HEAD'] },
        'ssl.store': { uri: 'ssl', methods: ['POST'] },
        'ssl.show': { uri: 'ssl/{certificate}', methods: ['GET', 'HEAD'] },
        'ssl.destroy': { uri: 'ssl/{certificate}', methods: ['DELETE'] },
        'ssl.renew': { uri: 'ssl/{certificate}/renew', methods: ['POST'] },
        'ssl.toggle': { uri: 'ssl/{certificate}/toggle', methods: ['POST'] },
        'ssl.renewAll': { uri: 'ssl/renew-all', methods: ['POST'] },
        'ssl.deploy': { uri: 'ssl/deploy', methods: ['POST'] },

        // Redirects routes
        'redirects.index': { uri: 'redirects', methods: ['GET', 'HEAD'] },
        'redirects.create': { uri: 'redirects/create', methods: ['GET', 'HEAD'] },
        'redirects.store': { uri: 'redirects', methods: ['POST'] },
        'redirects.edit': { uri: 'redirects/{redirect}/edit', methods: ['GET', 'HEAD'] },
        'redirects.update': { uri: 'redirects/{redirect}', methods: ['PUT', 'PATCH'] },
        'redirects.destroy': { uri: 'redirects/{redirect}', methods: ['DELETE'] },

        // Logs routes
        'logs.index': { uri: 'logs', methods: ['GET', 'HEAD'] },
    }
};

export { Ziggy };

// Função route para uso em componentes Vue
function buildUrl(name) {
    const r = Ziggy.routes[name];
    if (!r) {
        console.error(`Route [${name}] not found.`);
        return '#';
    }
    return `/${r.uri}`;
}

function currentMatches(pattern) {
    const currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
    if (pattern && pattern.includes && pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(currentPath);
    }
    return currentPath === pattern;
}

function route(name, params, absolute) {
    // Se nome for fornecido, retorna URL da rota
    if (typeof name === 'string') {
        return buildUrl(name);
    }
    // Sem argumentos: retorna helper com .current
    return {
        current: (pattern) => currentMatches(pattern),
    };
}

// Compatibilidade: permitir uso route.current('pattern')
route.current = function (pattern) {
    return currentMatches(pattern);
};

export { route };

declare namespace App {
    interface Platform {
        env: {
            COUNTER: DurableObjectNamespace;
        };
        context: {
            waitUntil(promise: Promise<any>): void;
        };
        caches: CacheStorage & { default: Cache }
    }
    
    interface Locals {
        user: {
            name: string;
            role: string;
        } | null;
        password?: string;
    }
}
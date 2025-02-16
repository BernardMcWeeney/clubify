// src/app.d.ts
declare global {
    namespace App {
        interface Locals {
            tenant: {
                id: string;
                name: string;
                domain: string;
            } | null;
        }
        interface PageData {
            tenant?: {
                id: string;
                name: string;
                domain: string;
            } | null;
        }
    }
}

export {};
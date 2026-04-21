import * as schema from "./schema.js";
export declare const db: import("drizzle-orm/libsql").LibSQLDatabase<typeof schema>;
export declare function backupDatabase(): Promise<void>;
export declare function initializeDatabase(): Promise<void>;
export { schema };
//# sourceMappingURL=index.d.ts.map
/**
 * Shadow Table Migrator
 * Implements zero-downtime migrations using shadow tables and triggers
 * Ensures continuous app availability during schema changes
 */

(function() {
    'use strict';
    
    class ShadowTableMigrator {
        constructor() {
            this.batchSize = 1000;
            this.syncDelay = 10; // ms between batches
            this.verificationSampleSize = 100;
            this.maxRetries = 3;
            
            // Track migration state
            this.state = {
                inProgress: false,
                currentTable: null,
                rowsMigrated: 0,
                totalRows: 0,
                startTime: null
            };
        }
        
        /**
         * Perform zero-downtime migration using shadow tables
         */
        async performZeroDowntimeMigration(migrationConfig) {
            console.log('[ShadowTableMigrator] Starting zero-downtime migration');
            
            if (this.state.inProgress) {
                throw new Error('Migration already in progress');
            }
            
            this.state.inProgress = true;
            this.state.startTime = Date.now();
            
            try {
                // Validate migration config
                this.validateConfig(migrationConfig);
                
                // Phase 1: Create shadow tables with new schema
                await this.createShadowTables(migrationConfig);
                
                // Phase 2: Setup real-time sync triggers
                await this.setupSyncTriggers(migrationConfig);
                
                // Phase 3: Progressive backfill of existing data
                await this.progressiveBackfill(migrationConfig);
                
                // Phase 4: Verify data consistency
                await this.verifyDataConsistency(migrationConfig);
                
                // Phase 5: Atomic cutover to new tables
                await this.performAtomicCutover(migrationConfig);
                
                // Phase 6: Cleanup old tables (deferred)
                this.scheduleCleanup(migrationConfig);
                
                console.log('[ShadowTableMigrator] Migration completed successfully');
                return {
                    success: true,
                    duration: Date.now() - this.state.startTime,
                    rowsMigrated: this.state.rowsMigrated
                };
                
            } catch (error) {
                console.error('[ShadowTableMigrator] Migration failed:', error);
                
                // Rollback: Remove shadow tables and triggers
                await this.rollbackMigration(migrationConfig);
                
                throw error;
            } finally {
                this.state.inProgress = false;
            }
        }
        
        /**
         * Validate migration configuration
         */
        validateConfig(config) {
            if (!config.tables || !Array.isArray(config.tables)) {
                throw new Error('Invalid migration config: tables array required');
            }
            
            for (const table of config.tables) {
                if (!table.name || !table.newSchema) {
                    throw new Error(`Invalid table config: ${JSON.stringify(table)}`);
                }
            }
        }
        
        /**
         * Create shadow tables with new schema
         */
        async createShadowTables(config) {
            console.log('[ShadowTableMigrator] Creating shadow tables...');
            
            for (const tableConfig of config.tables) {
                const shadowName = `${tableConfig.name}_shadow`;
                
                // Drop existing shadow table if exists
                await this.executeSql(`DROP TABLE IF EXISTS ${shadowName}`);
                
                // Create new shadow table
                await this.executeSql(tableConfig.newSchema.replace(tableConfig.name, shadowName));
                
                // Create indexes on shadow table
                if (tableConfig.indexes) {
                    for (const index of tableConfig.indexes) {
                        const shadowIndex = index.replace(tableConfig.name, shadowName);
                        await this.executeSql(shadowIndex);
                    }
                }
                
                console.log(`[ShadowTableMigrator] Created shadow table: ${shadowName}`);
            }
        }
        
        /**
         * Setup triggers for real-time sync
         */
        async setupSyncTriggers(config) {
            console.log('[ShadowTableMigrator] Setting up sync triggers...');
            
            for (const tableConfig of config.tables) {
                const tableName = tableConfig.name;
                const shadowName = `${tableName}_shadow`;
                
                // Insert trigger
                const insertTrigger = `
                    CREATE TRIGGER IF NOT EXISTS ${tableName}_insert_sync
                    AFTER INSERT ON ${tableName}
                    FOR EACH ROW
                    BEGIN
                        ${this.generateSyncInsertSql(tableConfig, shadowName)};
                    END
                `;
                await this.executeSql(insertTrigger);
                
                // Update trigger
                const updateTrigger = `
                    CREATE TRIGGER IF NOT EXISTS ${tableName}_update_sync
                    AFTER UPDATE ON ${tableName}
                    FOR EACH ROW
                    BEGIN
                        ${this.generateSyncUpdateSql(tableConfig, shadowName)};
                    END
                `;
                await this.executeSql(updateTrigger);
                
                // Delete trigger
                const deleteTrigger = `
                    CREATE TRIGGER IF NOT EXISTS ${tableName}_delete_sync
                    AFTER DELETE ON ${tableName}
                    FOR EACH ROW
                    BEGIN
                        DELETE FROM ${shadowName} WHERE id = OLD.id;
                    END
                `;
                await this.executeSql(deleteTrigger);
                
                console.log(`[ShadowTableMigrator] Created sync triggers for: ${tableName}`);
            }
        }
        
        /**
         * Generate INSERT sync SQL based on column mapping
         */
        generateSyncInsertSql(tableConfig, shadowName) {
            if (tableConfig.columnMapping) {
                const columns = [];
                const values = [];
                
                for (const [oldCol, newCol] of Object.entries(tableConfig.columnMapping)) {
                    columns.push(newCol);
                    values.push(`NEW.${oldCol}`);
                }
                
                // Add default values for new columns
                if (tableConfig.newColumns) {
                    for (const [col, defaultValue] of Object.entries(tableConfig.newColumns)) {
                        columns.push(col);
                        values.push(defaultValue);
                    }
                }
                
                return `INSERT INTO ${shadowName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
            } else {
                // Simple case: same schema
                return `INSERT INTO ${shadowName} SELECT * FROM ${tableConfig.name} WHERE id = NEW.id`;
            }
        }
        
        /**
         * Generate UPDATE sync SQL
         */
        generateSyncUpdateSql(tableConfig, shadowName) {
            if (tableConfig.columnMapping) {
                const updates = [];
                
                for (const [oldCol, newCol] of Object.entries(tableConfig.columnMapping)) {
                    updates.push(`${newCol} = NEW.${oldCol}`);
                }
                
                return `UPDATE ${shadowName} SET ${updates.join(', ')} WHERE id = NEW.id`;
            } else {
                // For same schema, delete and re-insert
                return `DELETE FROM ${shadowName} WHERE id = NEW.id; 
                        INSERT INTO ${shadowName} SELECT * FROM ${tableConfig.name} WHERE id = NEW.id`;
            }
        }
        
        /**
         * Progressive backfill of existing data
         */
        async progressiveBackfill(config) {
            console.log('[ShadowTableMigrator] Starting progressive backfill...');
            
            for (const tableConfig of config.tables) {
                await this.backfillTable(tableConfig);
            }
        }
        
        /**
         * Backfill a single table
         */
        async backfillTable(tableConfig) {
            const tableName = tableConfig.name;
            const shadowName = `${tableName}_shadow`;
            
            this.state.currentTable = tableName;
            
            // Get total row count
            const countResult = await this.executeSql(`SELECT COUNT(*) as count FROM ${tableName}`);
            const totalRows = countResult[0].count;
            this.state.totalRows = totalRows;
            this.state.rowsMigrated = 0;
            
            console.log(`[ShadowTableMigrator] Backfilling ${totalRows} rows from ${tableName}`);
            
            // Get the highest ID already synced (from triggers)
            const syncedResult = await this.executeSql(`SELECT MAX(id) as maxId FROM ${shadowName}`);
            const lastSyncedId = syncedResult[0].maxId || 0;
            
            // Backfill in batches
            let offset = 0;
            let retryCount = 0;
            
            while (offset < totalRows) {
                try {
                    // Get batch of rows not yet synced
                    const batch = await this.executeSql(`
                        SELECT * FROM ${tableName} 
                        WHERE id <= ${lastSyncedId}
                        ORDER BY id
                        LIMIT ${this.batchSize} OFFSET ${offset}
                    `);
                    
                    if (batch.length === 0) break;
                    
                    // Insert batch into shadow table
                    await this.insertBatchIntoShadow(batch, tableConfig, shadowName);
                    
                    // Update progress
                    this.state.rowsMigrated += batch.length;
                    offset += batch.length;
                    
                    // Report progress
                    const progress = (this.state.rowsMigrated / totalRows) * 100;
                    if (window.migrationUI) {
                        window.migrationUI.showProgress('migration', progress, {
                            rowCount: totalRows
                        });
                    }
                    
                    // Yield to prevent blocking
                    await new Promise(resolve => setTimeout(resolve, this.syncDelay));
                    
                    // Reset retry count on success
                    retryCount = 0;
                    
                } catch (error) {
                    console.error(`[ShadowTableMigrator] Backfill error at offset ${offset}:`, error);
                    
                    retryCount++;
                    if (retryCount >= this.maxRetries) {
                        throw new Error(`Backfill failed after ${this.maxRetries} retries: ${error.message}`);
                    }
                    
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
            
            console.log(`[ShadowTableMigrator] Backfilled ${this.state.rowsMigrated} rows for ${tableName}`);
        }
        
        /**
         * Insert batch into shadow table
         */
        async insertBatchIntoShadow(batch, tableConfig, shadowName) {
            // Use transaction for atomic batch insert
            await this.executeSql('BEGIN TRANSACTION');
            
            try {
                for (const row of batch) {
                    // Check if row already exists (from trigger sync)
                    const exists = await this.executeSql(
                        `SELECT 1 FROM ${shadowName} WHERE id = ?`,
                        [row.id]
                    );
                    
                    if (exists.length === 0) {
                        // Transform row based on column mapping
                        const transformedRow = this.transformRow(row, tableConfig);
                        
                        // Build insert SQL
                        const columns = Object.keys(transformedRow);
                        const placeholders = columns.map(() => '?').join(', ');
                        const values = columns.map(col => transformedRow[col]);
                        
                        await this.executeSql(
                            `INSERT INTO ${shadowName} (${columns.join(', ')}) VALUES (${placeholders})`,
                            values
                        );
                    }
                }
                
                await this.executeSql('COMMIT');
            } catch (error) {
                await this.executeSql('ROLLBACK');
                throw error;
            }
        }
        
        /**
         * Transform row based on column mapping
         */
        transformRow(row, tableConfig) {
            if (!tableConfig.columnMapping) {
                return row;
            }
            
            const transformed = {};
            
            // Map existing columns
            for (const [oldCol, newCol] of Object.entries(tableConfig.columnMapping)) {
                if (row.hasOwnProperty(oldCol)) {
                    transformed[newCol] = row[oldCol];
                }
            }
            
            // Add new columns with defaults
            if (tableConfig.newColumns) {
                for (const [col, defaultValue] of Object.entries(tableConfig.newColumns)) {
                    transformed[col] = defaultValue;
                }
            }
            
            return transformed;
        }
        
        /**
         * Verify data consistency between original and shadow tables
         */
        async verifyDataConsistency(config) {
            console.log('[ShadowTableMigrator] Verifying data consistency...');
            
            const verificationResults = [];
            
            for (const tableConfig of config.tables) {
                const result = await this.verifyTable(tableConfig);
                verificationResults.push(result);
                
                if (!result.consistent) {
                    throw new Error(
                        `Data inconsistency detected in ${tableConfig.name}: ${result.reason}`
                    );
                }
            }
            
            console.log('[ShadowTableMigrator] All tables verified successfully');
            return verificationResults;
        }
        
        /**
         * Verify a single table
         */
        async verifyTable(tableConfig) {
            const tableName = tableConfig.name;
            const shadowName = `${tableName}_shadow`;
            
            // 1. Verify row counts
            const originalCount = await this.executeSql(`SELECT COUNT(*) as count FROM ${tableName}`);
            const shadowCount = await this.executeSql(`SELECT COUNT(*) as count FROM ${shadowName}`);
            
            if (originalCount[0].count !== shadowCount[0].count) {
                return {
                    table: tableName,
                    consistent: false,
                    reason: `Row count mismatch: original=${originalCount[0].count}, shadow=${shadowCount[0].count}`
                };
            }
            
            // 2. Sample verification
            const sampleSize = Math.min(this.verificationSampleSize, originalCount[0].count);
            const sampleRows = await this.executeSql(`
                SELECT * FROM ${tableName} 
                ORDER BY RANDOM() 
                LIMIT ${sampleSize}
            `);
            
            for (const originalRow of sampleRows) {
                const shadowRows = await this.executeSql(
                    `SELECT * FROM ${shadowName} WHERE id = ?`,
                    [originalRow.id]
                );
                
                if (shadowRows.length === 0) {
                    return {
                        table: tableName,
                        consistent: false,
                        reason: `Missing row in shadow table: id=${originalRow.id}`
                    };
                }
                
                // Verify mapped columns
                const shadowRow = shadowRows[0];
                const transformed = this.transformRow(originalRow, tableConfig);
                
                for (const [col, value] of Object.entries(transformed)) {
                    if (shadowRow[col] !== value) {
                        return {
                            table: tableName,
                            consistent: false,
                            reason: `Data mismatch for id=${originalRow.id}, column=${col}`
                        };
                    }
                }
            }
            
            // 3. Verify constraints
            if (tableConfig.constraints) {
                for (const constraint of tableConfig.constraints) {
                    const valid = await this.verifyConstraint(shadowName, constraint);
                    if (!valid) {
                        return {
                            table: tableName,
                            consistent: false,
                            reason: `Constraint violation: ${constraint}`
                        };
                    }
                }
            }
            
            return {
                table: tableName,
                consistent: true,
                rowCount: originalCount[0].count,
                samplesVerified: sampleSize
            };
        }
        
        /**
         * Perform atomic cutover to new tables
         */
        async performAtomicCutover(config) {
            console.log('[ShadowTableMigrator] Performing atomic cutover...');
            
            // Use exclusive transaction for atomicity
            await this.executeSql('BEGIN EXCLUSIVE TRANSACTION');
            
            try {
                for (const tableConfig of config.tables) {
                    const tableName = tableConfig.name;
                    const shadowName = `${tableName}_shadow`;
                    const backupName = `${tableName}_old`;
                    
                    // Drop sync triggers
                    await this.executeSql(`DROP TRIGGER IF EXISTS ${tableName}_insert_sync`);
                    await this.executeSql(`DROP TRIGGER IF EXISTS ${tableName}_update_sync`);
                    await this.executeSql(`DROP TRIGGER IF EXISTS ${tableName}_delete_sync`);
                    
                    // Rename original table to backup
                    await this.executeSql(`ALTER TABLE ${tableName} RENAME TO ${backupName}`);
                    
                    // Rename shadow table to original name
                    await this.executeSql(`ALTER TABLE ${shadowName} RENAME TO ${tableName}`);
                    
                    console.log(`[ShadowTableMigrator] Cutover complete for ${tableName}`);
                }
                
                // Final integrity check
                await this.executeSql('PRAGMA integrity_check');
                
                // Commit the cutover
                await this.executeSql('COMMIT');
                
                console.log('[ShadowTableMigrator] Atomic cutover completed successfully');
                
            } catch (error) {
                console.error('[ShadowTableMigrator] Cutover failed, rolling back:', error);
                await this.executeSql('ROLLBACK');
                throw error;
            }
        }
        
        /**
         * Schedule cleanup of old tables
         */
        scheduleCleanup(config) {
            // Schedule cleanup for 24 hours later
            const cleanupDelay = 24 * 60 * 60 * 1000;
            
            setTimeout(async () => {
                try {
                    await this.cleanupOldTables(config);
                } catch (error) {
                    console.error('[ShadowTableMigrator] Cleanup error:', error);
                }
            }, cleanupDelay);
            
            console.log('[ShadowTableMigrator] Cleanup scheduled for 24 hours');
        }
        
        /**
         * Clean up old tables
         */
        async cleanupOldTables(config) {
            for (const tableConfig of config.tables) {
                const backupName = `${tableConfig.name}_old`;
                
                try {
                    await this.executeSql(`DROP TABLE IF EXISTS ${backupName}`);
                    console.log(`[ShadowTableMigrator] Dropped old table: ${backupName}`);
                } catch (error) {
                    console.error(`[ShadowTableMigrator] Failed to drop ${backupName}:`, error);
                }
            }
        }
        
        /**
         * Rollback migration on failure
         */
        async rollbackMigration(config) {
            console.log('[ShadowTableMigrator] Rolling back migration...');
            
            try {
                for (const tableConfig of config.tables) {
                    const tableName = tableConfig.name;
                    const shadowName = `${tableName}_shadow`;
                    
                    // Drop triggers
                    await this.executeSql(`DROP TRIGGER IF EXISTS ${tableName}_insert_sync`);
                    await this.executeSql(`DROP TRIGGER IF EXISTS ${tableName}_update_sync`);
                    await this.executeSql(`DROP TRIGGER IF EXISTS ${tableName}_delete_sync`);
                    
                    // Drop shadow table
                    await this.executeSql(`DROP TABLE IF EXISTS ${shadowName}`);
                }
                
                console.log('[ShadowTableMigrator] Rollback completed');
            } catch (error) {
                console.error('[ShadowTableMigrator] Rollback error:', error);
            }
        }
        
        /**
         * Execute SQL with proper error handling
         */
        async executeSql(sql, params = []) {
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                return await window.TaskSQLite.executeQuery(sql, params);
            } else {
                throw new Error('SQLite not available for shadow table migration');
            }
        }
        
        /**
         * Verify a constraint
         */
        async verifyConstraint(tableName, constraint) {
            try {
                const result = await this.executeSql(
                    `SELECT COUNT(*) as violations FROM ${tableName} WHERE NOT (${constraint})`
                );
                return result[0].violations === 0;
            } catch (error) {
                console.error(`[ShadowTableMigrator] Constraint check error:`, error);
                return false;
            }
        }
    }
    
    // Export to global scope
    window.ShadowTableMigrator = ShadowTableMigrator;
    
})();
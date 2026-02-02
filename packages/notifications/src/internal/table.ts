import type { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import type { PgColumn, PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";
import type { SchemaInstance } from "../types.ts";

type AnyTable = PgTableWithColumns<TableConfig>;
type AnyColumn = PgColumn<ColumnBaseConfig<ColumnDataType, string>, object, object>;

/**
 * Get a table from the schema by its configured name, throwing if not found.
 */
export function getTable(schema: SchemaInstance, tableName: string, label: string): AnyTable {
  const table = schema[tableName] as AnyTable | undefined;
  if (!table) {
    throw new Error(
      `Table "${tableName}" not found in schema. ` +
        `Make sure your schema includes the ${label} table ` +
        `and it's passed to createNotifications().`,
    );
  }
  return table;
}

/**
 * Get a column from a table, asserting it exists.
 * This is needed because PgTableWithColumns column access returns `T | undefined`
 * with noUncheckedIndexedAccess enabled.
 */
export function col(table: AnyTable, name: string): AnyColumn {
  const column = (table as Record<string, AnyColumn | undefined>)[name];
  if (!column) {
    throw new Error(`Column "${name}" not found on table. Check your schema definition.`);
  }
  return column;
}

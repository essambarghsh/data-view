/**
 * DataView Server Utilities
 * 
 * Cookie-based view mode persistence for server components.
 */

import { cookies } from "next/headers";
import { DATA_VIEW_MODE_COOKIE_NAME } from "@/configs/global-config";
import type { ViewMode } from "./types";

/**
 * Get the persisted view mode from cookies.
 * Used for server-side skeleton rendering.
 */
export async function getDataViewMode(defaultMode: ViewMode = "list"): Promise<ViewMode> {
    const cookieStore = await cookies();
    const viewMode = cookieStore.get(DATA_VIEW_MODE_COOKIE_NAME)?.value;

    if (viewMode === "list" || viewMode === "grid") {
        return viewMode;
    }

    return defaultMode;
}

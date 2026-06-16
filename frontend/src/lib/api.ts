import type {
  Drug,
  DrugInput,
  DrugQueryParams,
  PaginatedResponse,
} from "@/types/drug";

export class ApiError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const fieldErrors = (body?.field_errors ?? {}) as Record<string, string[]>;
    const detail =
      body?.detail ??
      body?.message ??
      `Request failed with status ${response.status}`;
    throw new ApiError(
      typeof detail === "string" ? detail : "Request failed",
      fieldErrors,
    );
  }

  return body as T;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  try {
    const response = await fetch(buildUrl(path, params), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Unable to reach server");
  }
}

function serializeDrugQuery(
  params: DrugQueryParams,
): Record<string, string | number | undefined> {
  const query: Record<string, string | number | undefined> = {
    page: params.page,
    page_size: params.page_size,
    search: params.search,
    manufacturer: params.manufacturer,
    dosage_form: params.dosage_form,
    min_price: params.min_price,
    max_price: params.max_price,
  };

  if (params.dea_schedule === "__none__") {
    query.dea_schedule = "";
  } else if (params.dea_schedule) {
    query.dea_schedule = params.dea_schedule;
  }

  return query;
}

export const api = {
  getDrugs(params: DrugQueryParams = {}) {
    return request<PaginatedResponse<Drug>>(
      "/drugs/",
      {},
      serializeDrugQuery(params),
    );
  },

  getDrug(id: number) {
    return request<Drug>(`/drugs/${id}/`);
  },

  createDrug(data: DrugInput) {
    return request<Drug>("/drugs/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDrug(id: number, data: Partial<DrugInput>) {
    return request<Drug>(`/drugs/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteDrug(id: number) {
    return request<void>(`/drugs/${id}/`, { method: "DELETE" });
  },
};

import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPagination(req: Request): PaginationParams {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export function formatPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  return {
    data,
    total,
    page: params.page,
    pages: Math.ceil(total / params.limit)
  };
}

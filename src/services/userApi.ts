import { apiRequest } from './api';

import type {
  CreateEmployeeInput,
  Employee,
  EmployeeResponse,
  EmployeesResponse,
  ResetEmployeePasswordInput,
  Seller,
  SellersResponse,
  UpdateEmployeeStatusInput,
} from '../types/user';

/*
 * Reaproveita requisições simultâneas no
 * React StrictMode durante o desenvolvimento.
 */
let sellersRequest:
  Promise<Seller[]> | null = null;

let employeesRequest:
  Promise<Employee[]> | null = null;

export function listSellers(): Promise<
  Seller[]
> {
  if (sellersRequest) {
    return sellersRequest;
  }

  sellersRequest =
    apiRequest<SellersResponse>(
      '/users/employees/sellers',
    )
      .then(
        (response) =>
          response.data.sellers,
      )
      .finally(() => {
        sellersRequest = null;
      });

  return sellersRequest;
}

export function listEmployees(): Promise<
  Employee[]
> {
  if (employeesRequest) {
    return employeesRequest;
  }

  employeesRequest =
    apiRequest<EmployeesResponse>(
      '/users/employees',
    )
      .then(
        (response) =>
          response.data.employees,
      )
      .finally(() => {
        employeesRequest = null;
      });

  return employeesRequest;
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const response =
    await apiRequest<EmployeeResponse>(
      '/users/employees',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );

  return response.data.employee;
}

export async function updateEmployeeStatus(
  employeeId: string,
  input: UpdateEmployeeStatusInput,
): Promise<Employee> {
  const response =
    await apiRequest<EmployeeResponse>(
      `/users/employees/${employeeId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );

  return response.data.employee;
}

export async function resetEmployeePassword(
  employeeId: string,
  input: ResetEmployeePasswordInput,
): Promise<Employee> {
  const response =
    await apiRequest<EmployeeResponse>(
      `/users/employees/${employeeId}/password`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );

  return response.data.employee;
}
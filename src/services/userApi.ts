import { apiRequest } from './api';

import type {
  CreateEmployeeInput,
  Employee,
  EmployeeResponse,
  EmployeesResponse,
  ResetEmployeePasswordInput,
  UpdateEmployeeStatusInput,
} from '../types/user';

export async function listEmployees(): Promise<
  Employee[]
> {
  const response =
    await apiRequest<EmployeesResponse>(
      '/users/employees',
    );

  return response.data.employees;
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
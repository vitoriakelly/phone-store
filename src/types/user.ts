export type UserRole =
  | 'MASTER'
  | 'FUNCIONARIO';

export interface Seller {
  id: string;
  name: string;
  role: UserRole;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'FUNCIONARIO';
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateEmployeeStatusInput {
  active: boolean;
}

export interface ResetEmployeePasswordInput {
  password: string;
}

export interface SellersResponse {
  data: {
    sellers: Seller[];
  };
}

export interface EmployeesResponse {
  data: {
    employees: Employee[];
  };
}

export interface EmployeeResponse {
  message: string;

  data: {
    employee: Employee;
  };
}
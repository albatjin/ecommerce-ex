export interface SignUpDTO {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  smsConsent?: boolean;
  emailConsent?: boolean;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  id: string;
  email: string;
  name: string;
  customerNumber: string;
  role: string;
  membershipGrade: string;
  rewardPoints: number;
}


import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해 주세요.')
    .email('올바른 이메일 주소 형식이 아닙니다.'),
  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해 주세요.')
      .email('올바른 이메일 주소 형식이 아닙니다.'),
    password: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
    confirmPassword: z
      .string()
      .min(1, '비밀번호 확인을 입력해 주세요.'),
    name: z
      .string()
      .min(2, '이름은 최소 2자 이상이어야 합니다.'),
    phone: z
      .string()
      .refine(
        (val) => !val || /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/.test(val) || /^[0-9]{10,11}$/.test(val),
        { message: '올바른 휴대폰 번호 형식을 입력해 주세요 (예: 010-1234-5678)' }
      ),
    termsConsent: z
      .boolean()
      .refine((val) => val === true, {
        message: '이용약관 및 개인정보 수집에 동의해야 합니다.',
      }),
    smsConsent: z.boolean(),
    emailConsent: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type SignUpSchemaType = z.infer<typeof signUpSchema>;


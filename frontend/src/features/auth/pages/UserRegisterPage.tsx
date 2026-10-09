import { UserRegisterForm } from '../components/UserRegisterForm';

export function UserRegisterPage() {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-foreground text-center mb-6">
        Đăng Ký Tài Khoản
      </h2>
      <UserRegisterForm />
    </div>
  );
}

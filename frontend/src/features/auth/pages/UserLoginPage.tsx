import { UserLoginForm } from '../components/UserLoginForm';

export function UserLoginPage() {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-foreground text-center mb-6">
        Đăng Nhập Người Chơi
      </h2>
      <UserLoginForm />
    </div>
  );
}

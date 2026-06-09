import { AuthCard } from '@/components/auth-card';
import { GitHubButton } from '@/components/github-button';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <AuthCard>
      <h1 className="auth-heading">Welcome back</h1>
      <p className="auth-subheading">Sign in to continue</p>

      <div className="auth-social">
        <GitHubButton />
      </div>

      <div className="auth-divider auth-divider-spacing">
        <hr />
        <span>or</span>
        <hr />
      </div>

      <LoginForm />
    </AuthCard>
  );
}

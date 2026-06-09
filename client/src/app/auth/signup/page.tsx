import { AuthCard } from '@/components/auth-card';
import { GitHubButton } from '@/components/github-button';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <AuthCard>
      <h1 className="auth-heading">Create your account</h1>
      <p className="auth-subheading">Start visualizing</p>

      <div className="auth-social">
        <GitHubButton />
      </div>

      <div className="auth-divider auth-divider-spacing">
        <hr />
        <span>or</span>
        <hr />
      </div>

      <SignupForm />
    </AuthCard>
  );
}

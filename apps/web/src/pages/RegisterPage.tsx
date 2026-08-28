import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useRegisterMutation } from '@/store/authApi';

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [register] = useRegisterMutation();

  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await register({ ...values, name: values.name || undefined }).unwrap();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'data' in err
          ? (err as { data: { message?: string } }).data?.message
          : undefined;
      setError('root', { message: msg ?? 'Registration failed' });
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start your free workspace today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">
            Name <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input id="name" placeholder="Alex Johnson" {...field('name')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...field('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min 8 characters" {...field('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {errors.root && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="mt-4 space-y-4">
        <AuthDivider />
        <GoogleButton label="Continue with Google" />
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

import Image from 'next/image';
import logo from '@/../public/logo.webp';
import { SignInForm } from '@/components/sign-in-form';

export default function SignInPage() {
  return (
    <main 
      aria-label="Sign in page"
      className="flex flex-col items-center justify-center min-h-screen text-center space-y-6"
    >
      {/* Use next/image for optimization */}
      <Image src={logo} alt="Wiseman AI Logo" width={500} height={150} priority />

      <h1 className="text-2xl font-semibold">Welcome to Wiseman AI!</h1>
      <SignInForm />
    </main>
  );
}

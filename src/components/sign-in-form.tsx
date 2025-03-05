'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInAction } from '@/services/msEntraId';

function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="px-4 py-2 mt-3 text-white bg-[#00653b] rounded-md hover:bg-[#004d2a] disabled:bg-gray-400 transition-all"
    >
      {pending ? 'Signing in...' : 'Sign in with Microsoft'}
    </button>
  );
}

export function SignInForm() {
  const [errorMessage, signIn] = useFormState(signInAction, undefined);

  return (
    <form action={signIn} className="flex flex-col items-center space-y-4">
      <p className="text-gray-600">Sign in with your Taylor Wiseman & Taylor account to continue</p>
      <SignInButton />
      {errorMessage && (
        <p role="alert" className="text-red-500 pt-2 text-sm">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

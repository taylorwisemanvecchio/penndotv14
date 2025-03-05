'use server';

import { auth } from '@/auth';

export async function getUser() {
    const session = await auth();
    const fullName = session?.user?.name || 'User';

    // Split by comma and trim spaces
    const nameParts = fullName.split(',').map((part) => part.trim());

    // If the name is in "Last, First" format, return the first name (second part)
    const firstName = nameParts.length > 1 ? nameParts[1] : nameParts[0];

    return firstName;
}

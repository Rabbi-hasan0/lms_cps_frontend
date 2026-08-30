// app/lib/auth.ts বা lib/auth.ts
export const getRoleDashboardPath = (roleInput: any): string => {
  // roleInput যদি স্ট্রিং বা অবজেক্ট হয়
  let roleName = '';
  if (typeof roleInput === 'string') {
    roleName = roleInput;
  } else if (roleInput && typeof roleInput === 'object') {
    roleName = roleInput.name || roleInput.type || '';
  }

  const role = roleName.toLowerCase().replace(/[\s\-_]+/g, '');

  if (role.includes('admin')) {
    return '/dashboard/admin';
  }
  
  if (role.includes('content') || role.includes('manager')) {
    return '/dashboard/content-manager';
  }
  
  if (role.includes('instructor') || role.includes('teacher')) {
    return '/dashboard/instructor';
  }
  
  return '/dashboard/student';
};

export const redirectByRole = (roleInput: any, router: any) => {
  const targetPath = getRoleDashboardPath(roleInput);
  router.push(targetPath);
};
// utils/branchAccess.js

export const getUserBranch = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return null;
    
    // If user is admin, they can access all branches
    if (user.isAdmin) return null;
    
    // For HR managers, return their specific branch
    return user.branchName;
  };
  
  export const canAccessBranch = (targetBranch) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return false;
    
    // Admins can access all branches
    if (user.isAdmin) return true;
    
    // HR managers can only access their own branch
    if (user.role === 'hr_manager') {
      return user.branchName === targetBranch;
    }
    
    return false;
  };
  
  export const filterDataByBranch = (data, branchField = 'branch') => {
    const userBranch = getUserBranch();
    if (!userBranch) return data; // Admin sees all data
    
    return data.filter(item => {
      // Handle nested branch field (e.g., professionalDetails.branch)
      if (branchField.includes('.')) {
        const [parent, child] = branchField.split('.');
        return item[parent][child] === userBranch;
      }
      return item[branchField] === userBranch;
    });
  };
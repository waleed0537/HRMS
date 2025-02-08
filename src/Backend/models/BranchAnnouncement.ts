export interface BranchAnnouncement {
    id: string;
    title: string;
    content: string;
    branch: string;
    createdBy: string;
    createdAt: Date;
    expiresAt?: Date;
  }
  
  // Backend API for Branch Announcements
  export interface BranchAnnouncementService {
    // Create a new branch announcement
    createAnnouncement(announcement: Omit<BranchAnnouncement, 'id' | 'createdAt'>): Promise<BranchAnnouncement>;
  
    // Get announcements for a specific branch
    getAnnouncementsForBranch(branch: string): Promise<BranchAnnouncement[]>;
  
    // Delete an announcement
    deleteAnnouncement(announcementId: string): Promise<void>;
    
  }
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../store/notificationSlice';
import configService from '../appwrite/config';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.auth.userData);
  const { soundEnabled } = useSelector(state => state.notifications);
  const userRole = userData?.role || userData?.profile?.role || 'citizen';

  useEffect(() => {
    if (!userData) return;

    // Request notification permission
    notificationService.requestPermission();

    // Subscribe to issue events
    const unsubscribe = configService.subscribeToIssueEvents(async (issue) => {
      // Store notification for all officials (online and offline)
      if (userRole === 'official') {
        const notification = {
          title: 'New Complaint Received',
          message: `${issue.title} - ${issue.category}`,
          type: 'new_complaint',
          issueId: issue.$id
        };
        
        dispatch(addNotification(notification));
        
        if (soundEnabled) {
          notificationService.playNotificationSound();
        }
        
        notificationService.showBrowserNotification(
          notification.title,
          notification.message
        );
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userData, userRole, soundEnabled, dispatch]);

  // Function to notify citizens when their issue is resolved
  const notifyIssueResolved = (issue) => {
    if (userRole === 'citizen' && issue.createdBy === userData.$id) {
      const notification = {
        title: 'Issue Resolved',
        message: `Your complaint "${issue.title}" has been resolved`,
        type: 'issue_resolved',
        issueId: issue.$id
      };
      
      dispatch(addNotification(notification));
      
      if (soundEnabled) {
        notificationService.playNotificationSound();
      }
      
      notificationService.showBrowserNotification(
        notification.title,
        notification.message
      );
    }
  };

  return { notifyIssueResolved };
};
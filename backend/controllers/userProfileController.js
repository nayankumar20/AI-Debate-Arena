import * as userProfileService from '../services/userProfileService.js';

export async function getProfile(req, res) {
  const profile = await userProfileService.getProfileBundle(req.user.id);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, profile });
}

export async function updateProfile(req, res) {
  const profile = await userProfileService.updateUserProfile(req.user.id, req.body);
  res.json({ success: true, profile });
}

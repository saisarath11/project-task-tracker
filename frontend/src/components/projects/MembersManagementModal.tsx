import React, { useState } from 'react';
import { ProjectMember } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { projectsApi } from '../../api/projects';
import { UserPlus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MembersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectOwnerId: string;
  members: ProjectMember[];
  isOwnerOrAdmin: boolean;
  onMembersUpdated: () => void;
}

export const MembersManagementModal: React.FC<MembersManagementModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectOwnerId,
  members,
  isOwnerOrAdmin,
  onMembersUpdated,
}) => {
  const [emailToAdd, setEmailToAdd] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToAdd.trim()) return;

    try {
      setErrorMessage(null);
      setSuccessNotice(null);
      setIsAdding(true);

      await projectsApi.addMember(projectId, emailToAdd.trim());
      setEmailToAdd('');
      setSuccessNotice('Member added to project successfully!');
      onMembersUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    try {
      setErrorMessage(null);
      setSuccessNotice(null);
      setRemovingUserId(userId);

      const res = await projectsApi.removeMember(projectId, userId);
      setSuccessNotice(
        `${userName} removed. ${res.unassignedTasksCount} assigned tasks automatically set to UNASSIGNED.`
      );
      onMembersUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove member');
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Team Members"
      description="Manage who can access and work on tasks in this project"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Add Member Form (BR-02: Only Owner or Admin) */}
        {isOwnerOrAdmin ? (
          <form onSubmit={handleAddMember} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={emailToAdd}
                onChange={(e) => setEmailToAdd(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="md"
              disabled={!emailToAdd.trim() || isAdding}
              isLoading={isAdding}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </Button>
          </form>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Only the project owner or an administrator can add or remove members (BR-02).
          </p>
        )}

        {/* Member List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Current Members ({members.length})
          </span>

          {members.map((member) => {
            const isProjectOwner = member.userId === projectOwnerId;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/90 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{member.user.name}</span>
                      {isProjectOwner ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Owner
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Member
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{member.user.email}</span>
                  </div>
                </div>

                <div>
                  {isOwnerOrAdmin && !isProjectOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId, member.user.name)}
                      isLoading={removingUserId === member.userId}
                      disabled={removingUserId === member.userId}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Remove member (unassigns their tasks)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Task, ProjectMember } from '../../types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { useAuth } from '../../hooks/useAuth';
import { tasksApi } from '../../api/tasks';
import { formatDate, isTaskOverdue } from '../../utils/cn';
import { aiApi, AiTaskSummary, AiEffortEstimate } from '../../api/ai';
import {
  Calendar,
  User,
  Clock,
  Trash2,
  RefreshCw,
  Send,
  History,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Sparkles,
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectOwnerId?: string;
  members: ProjectMember[];
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  projectOwnerId,
  members,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history' | 'ai'>('details');
  const [aiSummary, setAiSummary] = useState<AiTaskSummary | null>(null);
  const [aiEstimate, setAiEstimate] = useState<AiEffortEstimate | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<string>('MEDIUM');
  const [editAssigneeId, setEditAssigneeId] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState<string>('');

  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  React.useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditPriority(task.priority);
      setEditAssigneeId(task.assigneeId || '');
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setErrorMessage(null);
      setIsConflict(false);
      setIsEditing(false);
      setAiSummary(null);
      setAiEstimate(null);
    }
  }, [task]);

  const handleGenerateAiInsights = async () => {
    if (!task) return;
    try {
      setIsLoadingAi(true);
      const [summaryRes, estimateRes] = await Promise.all([
        aiApi.summarizeTask(task.id),
        aiApi.estimateEffort({
          title: task.title,
          description: task.description || undefined,
          priority: task.priority,
        }),
      ]);
      setAiSummary(summaryRes);
      setAiEstimate(estimateRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate AI insights');
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (!task) return null;

  const isOwner = user?.id === projectOwnerId;
  const isAdmin = user?.role === 'ADMIN';
  const isReporter = user?.id === task.reporterId;
  const canDelete = isReporter || isOwner || isAdmin;
  const canReopen = isOwner || isAdmin;
  const overdue = isTaskOverdue(task.dueDate, task.status);

  // Status transitions handling according to BR-04 & BR-05
  const handleStatusChange = async (targetStatus: string) => {
    try {
      setErrorMessage(null);
      setIsConflict(false);
      setIsSubmittingStatus(true);

      await tasksApi.updateStatus(task.id, targetStatus, task.version);
      onTaskUpdated();
    } catch (err: any) {
      if (err.status === 409) {
        setIsConflict(true);
      }
      setErrorMessage(err.message || 'Failed to update task status');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setErrorMessage(null);
      setIsConflict(false);

      await tasksApi.updateTask(task.id, {
        title: editTitle,
        description: editDescription || null,
        priority: editPriority,
        assigneeId: editAssigneeId ? editAssigneeId : null,
        dueDate: editDueDate ? editDueDate : null,
        version: task.version,
      });

      setIsEditing(false);
      onTaskUpdated();
    } catch (err: any) {
      if (err.status === 409) {
        setIsConflict(true);
      }
      setErrorMessage(err.message || 'Failed to save changes');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setIsSubmittingComment(true);
      setErrorMessage(null);
      await tasksApi.addComment(task.id, commentContent.trim());
      setCommentContent('');
      onTaskUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setIsDeleting(true);
      await tasksApi.deleteTask(task.id);
      setShowDeleteConfirm(false);
      onTaskDeleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete task');
      setIsDeleting(false);
    }
  };

  const priorityVariants = {
    LOW: 'secondary',
    MEDIUM: 'warning',
    HIGH: 'destructive',
  } as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.taskKey} maxWidth="2xl">
      <div className="space-y-5">
        {/* Error / Conflict Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-3 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
            {isConflict && (
              <Button size="sm" variant="outline" onClick={onTaskUpdated} className="gap-1 bg-white">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Task</span>
              </Button>
            )}
          </div>
        )}

        {/* Status Transition Action Bar (BR-04, BR-05) */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status:
            </span>
            <Badge
              variant={
                task.status === 'DONE'
                  ? 'success'
                  : task.status === 'IN_PROGRESS'
                  ? 'info'
                  : task.status === 'IN_REVIEW'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {task.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {task.status === 'TODO' && (
              <Button
                size="sm"
                variant="primary"
                isLoading={isSubmittingStatus}
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="gap-1.5"
              >
                <span>Move to In Progress</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {task.status === 'IN_PROGRESS' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isSubmittingStatus}
                  onClick={() => handleStatusChange('TODO')}
                >
                  Return to To Do
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingStatus}
                  onClick={() => handleStatusChange('IN_REVIEW')}
                  className="gap-1.5"
                >
                  <span>Submit for Review</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {task.status === 'IN_REVIEW' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isSubmittingStatus}
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                >
                  Back to In Progress
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingStatus}
                  onClick={() => handleStatusChange('DONE')}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Mark as Done</span>
                </Button>
              </>
            )}

            {task.status === 'DONE' && (
              canReopen ? (
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isSubmittingStatus}
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reopen Task (Owner/Admin)</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  Reopening restricted to Project Owner / Admin (BR-05)
                </span>
              )
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Comments ({task.comments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Activity Log</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              if (!aiSummary) {
                handleGenerateAiInsights();
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-purple-600 hover:text-purple-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Copilot Insights</span>
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <Input
                  label="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <Textarea
                  label="Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Priority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </Select>

                  <Select
                    label="Assignee"
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.user.email})
                      </option>
                    ))}
                  </Select>
                </div>
                <Input
                  type="date"
                  label="Due Date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1 shrink-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>
                </div>

                <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 min-h-[5rem]">
                  {task.description || <span className="text-gray-400 italic">No description provided.</span>}
                </div>

                {/* Metadata Grid */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1">Priority</span>
                    <Badge variant={priorityVariants[task.priority]}>{task.priority}</Badge>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Assignee</span>
                    <span className="font-semibold text-gray-800">
                      {task.assignee ? task.assignee.name : 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Reporter</span>
                    <span className="font-semibold text-gray-800">{task.reporter?.name}</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Due Date</span>
                    <span
                      className={`font-semibold ${
                        overdue ? 'text-rose-600 font-bold' : 'text-gray-800'
                      }`}
                    >
                      {formatDate(task.dueDate)} {overdue && '(Overdue)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 px-1">
                  <span>Version: {task.version} (Optimistic Concurrency)</span>
                  <span>Created {new Date(task.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
              {(!task.comments || task.comments.length === 0) ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                task.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-white border border-gray-200/90 rounded-xl shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">{comment.user.name}</span>
                      <span className="text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentContent.trim() || isSubmittingComment}
                isLoading={isSubmittingComment}
                className="gap-1"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Post</span>
              </Button>
            </form>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="max-h-72 overflow-y-auto space-y-2 pr-2 text-xs">
            {(!task.activityLogs || task.activityLogs.length === 0) ? (
              <div className="text-center py-6 text-gray-400">No activity recorded for this task.</div>
            ) : (
              task.activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{log.user.name}</span>{' '}
                    <span className="text-slate-600">performed {log.action}</span>
                  </div>
                  <span className="text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: AI Copilot Insights */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 text-purple-900">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-bold">AI Task Intelligence & Effort Estimates</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateAiInsights}
                isLoading={isLoadingAi}
                className="text-xs bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
              >
                Regenerate AI Analysis
              </Button>
            </div>

            {isLoadingAi ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : (
              aiSummary && aiEstimate && (
                <div className="space-y-4 text-xs">
                  {/* Executive Summary */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                    <span className="font-bold text-slate-900 block text-sm">Contextual Summary</span>
                    <p className="text-slate-700 leading-relaxed">{aiSummary.executiveSummary}</p>
                    <p className="text-slate-500 italic mt-1">{aiSummary.discussionContext}</p>
                  </div>

                  {/* Effort Estimation Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Story Points</span>
                      <span className="text-xl font-extrabold text-indigo-600">{aiEstimate.suggestedStoryPoints} pts</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Est. Hours</span>
                      <span className="text-xl font-extrabold text-blue-600">{aiEstimate.estimatedHours} hrs</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Complexity</span>
                      <span className="text-xs font-bold text-slate-800 block mt-1">{aiEstimate.complexityLevel}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Reviewers</span>
                      <span className="text-xl font-extrabold text-emerald-600">{aiEstimate.recommendedReviewers} peers</span>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-900 block">Suggested Action Items</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-700">
                      {aiSummary.suggestedActionItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            {canDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-medium">Confirm delete?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteTask}
                    isLoading={isDeleting}
                  >
                    Yes, Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Task</span>
                </Button>
              )
            )}
          </div>

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

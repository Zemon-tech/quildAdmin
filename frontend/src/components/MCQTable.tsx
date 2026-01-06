import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';
import type { MCQQuestion } from '@/types/admin';

interface MCQTableProps {
  mcqs: MCQQuestion[];
  onAddMCQ: () => void;
  onEditMCQ: (mcq: MCQQuestion, index: number) => void;
  onDeleteMCQ: (index: number) => void;
}

export function MCQTable({ mcqs, onAddMCQ, onEditMCQ, onDeleteMCQ }: MCQTableProps) {
  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    const colors = {
      easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[difficulty];
  };

  const getTypeColor = (type: 'direct' | 'scenario') => {
    const colors = {
      direct: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      scenario: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[type];
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handleDelete = (index: number, question: string) => {
    if (confirm(`Are you sure you want to delete the MCQ: "${truncateText(question, 30)}"?`)) {
      onDeleteMCQ(index);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">MCQ Questions</h3>
          <p className="text-sm text-muted-foreground">
            Manage multiple choice questions for this assessment stage
          </p>
        </div>
        <Button onClick={onAddMCQ} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add MCQ
        </Button>
      </div>

      {mcqs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No MCQ questions added yet.</p>
          <p className="text-sm">Click "Add MCQ" to create your first question.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mcqs.map((mcq, index) => {
                const correctCount = mcq.options.filter(opt => opt.isCorrect).length;
                return (
                  <TableRow key={mcq.id}>
                    <TableCell className="max-w-[200px]">
                      <div className="space-y-1">
                        <p className="font-medium">{truncateText(mcq.question)}</p>
                        {mcq.scenario && (
                          <p className="text-xs text-muted-foreground">
                            Scenario: {truncateText(mcq.scenario, 30)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(mcq.type)}>
                        {mcq.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(mcq.difficulty)}>
                        {mcq.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>{mcq.options.length}</TableCell>
                    <TableCell>
                      <span className={correctCount === 1 ? 'text-green-600' : 'text-red-600'}>
                        {correctCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditMCQ(mcq, index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(index, mcq.question)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
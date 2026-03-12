import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { nameRules } from '../../utils/validation';
import { useUpdateAccount } from '../../hooks/useUpdateAccount';
import type { Account } from '../../types/account';

interface EditNameModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

interface EditNameFormData {
  name: string;
}

export function EditNameModal({ open, onClose, account }: EditNameModalProps) {
  const mutation = useUpdateAccount();
  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit } = useForm<EditNameFormData>({
    defaultValues: { name: account.name },
    mode: 'onBlur',
  });

  if (!open) return null;

  const onSubmit = (values: EditNameFormData) => {
    mutation.mutate(
      { id: account.id, data: { name: values.name.trim() } },
      {
        onSuccess: () => {
          onClose();
          enqueueSnackbar('Nome atualizado!', { variant: 'success' });
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message || 'Erro ao atualizar nome.';
          enqueueSnackbar(msg, { variant: 'error' });
        },
      },
    );
  };

  return (
    <Dialog
      open
      disableEscapeKeyDown
      onClose={(_e, reason) => {
        if (reason === 'backdropClick') return;
      }}
    >
      <DialogTitle>Editar nome</DialogTitle>
      <DialogContent>
        <Controller
          name="name"
          control={control}
          rules={nameRules}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Nome completo"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          loading={mutation.isPending}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

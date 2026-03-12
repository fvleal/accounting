import { useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useAccount } from '../hooks/useAccount';
import { ProfileHero } from '../components/profile/ProfileHero';
import { ProfileSectionCard } from '../components/profile/ProfileSectionCard';
import { ProfileFieldRow } from '../components/profile/ProfileFieldRow';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { EditNameModal } from '../components/profile/EditNameModal';
import { EditBirthdayModal } from '../components/profile/EditBirthdayModal';
import { maskCpf } from '../utils/cpf';
import { formatBirthday } from '../utils/date';

export function ProfilePage() {
  const { data: account, isLoading, isError } = useAccount();
  const { enqueueSnackbar } = useSnackbar();
  const errorShownRef = useRef(false);
  const [editModal, setEditModal] = useState<'name' | 'birthday' | null>(null);

  useEffect(() => {
    if (isError && !errorShownRef.current) {
      errorShownRef.current = true;
      enqueueSnackbar('Erro ao carregar perfil.', { variant: 'error' });
    }
    if (!isError) {
      errorShownRef.current = false;
    }
  }, [isError, enqueueSnackbar]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!account) {
    return null;
  }

  return (
    <>
      <ProfileHero account={account} />
      <ProfileSectionCard title="Informacoes basicas">
        <ProfileFieldRow
          label="Nome"
          value={account.name}
          editable
          onClick={() => setEditModal('name')}
        />
        <ProfileFieldRow label="Email" value={account.email} />
        <ProfileFieldRow label="CPF" value={maskCpf(account.cpf)} />
      </ProfileSectionCard>
      <ProfileSectionCard title="Informacoes adicionais">
        <ProfileFieldRow
          label="Nascimento"
          value={formatBirthday(account.birthDate)}
          editable
          onClick={() => setEditModal('birthday')}
        />
      </ProfileSectionCard>
      {account && (
        <>
          <EditNameModal
            open={editModal === 'name'}
            onClose={() => setEditModal(null)}
            account={account}
          />
          <EditBirthdayModal
            open={editModal === 'birthday'}
            onClose={() => setEditModal(null)}
            account={account}
          />
        </>
      )}
    </>
  );
}

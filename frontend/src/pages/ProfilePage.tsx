import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useAccount } from '../hooks/useAccount';
import { ProfileHero } from '../components/profile/ProfileHero';
import { ProfileSectionCard } from '../components/profile/ProfileSectionCard';
import { ProfileFieldRow } from '../components/profile/ProfileFieldRow';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { maskCpf } from '../utils/cpf';
import { formatBirthday } from '../utils/date';
import { formatPhone } from '../utils/phone';

export function ProfilePage() {
  const { data: account, isLoading, isError } = useAccount();
  const { enqueueSnackbar } = useSnackbar();
  const errorShownRef = useRef(false);

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
        <ProfileFieldRow label="Nome" value={account.fullName} editable />
        <ProfileFieldRow label="Email" value={account.email} />
        <ProfileFieldRow label="CPF" value={maskCpf(account.cpf)} />
      </ProfileSectionCard>
      <ProfileSectionCard title="Informacoes adicionais">
        <ProfileFieldRow
          label="Nascimento"
          value={formatBirthday(account.dateOfBirth)}
          editable
        />
        <ProfileFieldRow
          label="Telefone"
          value={formatPhone(account.phone)}
          editable
        />
      </ProfileSectionCard>
    </>
  );
}

/* Read ONLY the fixed PostgreSQL 17 interlock header; never database memory.
 * IPC_STAT/SHM_RDONLY/shmdt only. No removal or write code is present.
 */
#include "postgres.h"
#include "storage/pg_shmem.h"
#include <sys/ipc.h>
#include <sys/shm.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
#undef printf
int main(int argc, char **argv) {
  if (argc != 2 || sizeof(PGShmemHeader) != 56) return 2;
  char *end = NULL; long id = strtol(argv[1], &end, 10);
  if (!*argv[1] || *end || id < 0 || id > INT_MAX) return 2;
  struct shmid_ds info;
  if (shmctl((int)id, IPC_STAT, &info) || info.shm_perm.uid != getuid() ||
      info.shm_segsz != sizeof(PGShmemHeader) || info.shm_nattch != 0) return 3;
  const PGShmemHeader *p = shmat((int)id, NULL, SHM_RDONLY);
  if (p == (void *)-1) return 4;
  if (p->magic != PGShmemMagic) {
    printf("{\"id\":%ld,\"postgresHeaderValid\":false,\"provenanceAvailable\":false}\n", id);
    return shmdt(p) ? 6 : 0;
  }
  /* Only provenance fields; no pointer, payload, credentials or records. */
  printf("{\"id\":%ld,\"uid\":%u,\"size\":%zu,\"attachmentsBefore\":0,\"creatorPid\":%d,\"kernelCreatorPid\":%d,\"device\":%llu,\"inode\":%llu,\"ctime\":%lld}\n",
    id, info.shm_perm.uid, (size_t)info.shm_segsz, p->creatorPID,
    info.shm_cpid, (unsigned long long)p->device,
    (unsigned long long)p->inode, (long long)info.shm_ctime);
  return shmdt(p) ? 6 : 0;
}

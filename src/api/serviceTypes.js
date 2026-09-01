import api, { unwrap, unwrapList } from './client';
import { labelToMinutes, minutesToLabel } from './format';

const serviceFromApi = (serviceType) => ({
  id: serviceType._id,
  name: serviceType.name ?? '',
  duration: minutesToLabel(serviceType.estimatedDurationMinutes),
});

const serviceToApi = (service) => ({
  name: service.name.trim(),
  estimatedDurationMinutes: labelToMinutes(service.duration),
});

export const listServiceTypesApi = async () => {
  const response = await api.get('/service-types', { params: { limit: 100 } });
  return unwrapList(response).map(serviceFromApi);
};

export const createServiceTypeApi = async (service) => {
  const response = await api.post('/service-types', serviceToApi(service));
  return serviceFromApi(unwrap(response));
};

export const updateServiceTypeApi = async (id, service) => {
  const response = await api.patch(`/service-types/${id}`, serviceToApi(service));
  return serviceFromApi(unwrap(response));
};

export const removeServiceTypeApi = async (id) => {
  await api.delete(`/service-types/${id}`);
};

/**
 * Persists the whole step in one pass: creates the rows added this session,
 * patches the ones whose name/duration changed, and deletes the rows the user
 * removed. There is no bulk endpoint, so this is a fan-out of single calls.
 */
export const syncServiceTypesApi = async (rows, original) => {
  const filled = rows.filter((row) => row.name.trim() && row.duration);
  const keptIds = new Set(filled.map((row) => row.id).filter(Boolean));

  const removed = original.filter((row) => row.id && !keptIds.has(row.id));
  await Promise.all(removed.map((row) => removeServiceTypeApi(row.id)));

  return Promise.all(
    filled.map((row) => {
      if (!row.id) return createServiceTypeApi(row);

      const before = original.find((item) => item.id === row.id);
      const unchanged =
        before && before.name === row.name && before.duration === row.duration;

      return unchanged ? row : updateServiceTypeApi(row.id, row);
    }),
  );
};

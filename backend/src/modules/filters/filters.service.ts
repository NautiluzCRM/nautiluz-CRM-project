import { ViewModel } from './view.model.js';

export function listFilters(userId: string) {
  return ViewModel.find({ $or: [{ owner: userId }, { isShared: true }] });
}

export function createFilter(userId: string, input: { name: string; filters: any; isShared?: boolean }) {
  return ViewModel.create({ ...input, owner: userId });
}

export function updateFilter(id: string, input: any) {
  return ViewModel.findByIdAndUpdate(id, input, { new: true });
}

export function deleteFilter(id: string) {
  return ViewModel.findByIdAndDelete(id);
}

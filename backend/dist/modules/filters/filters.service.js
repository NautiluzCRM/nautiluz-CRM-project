import { ViewModel } from './view.model.js';
export function listFilters(userId) {
    return ViewModel.find({ $or: [{ owner: userId }, { isShared: true }] });
}
export function createFilter(userId, input) {
    return ViewModel.create({ ...input, owner: userId });
}
export function updateFilter(id, input) {
    return ViewModel.findByIdAndUpdate(id, input, { new: true });
}
export function deleteFilter(id) {
    return ViewModel.findByIdAndDelete(id);
}

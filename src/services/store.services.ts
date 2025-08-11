import { Store } from '../models/store.model';
import { StoreInput } from '../models/store.model'; // Make sure this interface is defined there

export const createStore = async (data: StoreInput) => {
  return Store.create(data);
};

export const getStores = async (userId: string) => {
  return Store.find({ createdBy: userId });
};

export const updateStore = async (id: string, data: Partial<StoreInput>) => {
  return Store.findByIdAndUpdate(id, data, { new: true });
};

export const getStoreById = async (id: string) => {
  return Store.findById(id);
};

export const deleteStore = async (id: string) => {
  return Store.findByIdAndDelete(id);
};


export async function findStoreByUserId(userId: string) {
  return Store.findOne({ createdBy: userId }).exec();
}
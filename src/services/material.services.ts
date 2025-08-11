import { Material } from '../models/material.model';
import { Store } from '../models/store.model';
import { MaterialInput } from '../models/material.model';
import { BadRequestError } from '../utils/errors';
import mongoose from 'mongoose';

export const createMaterial = async (data: MaterialInput) => {
  const store = await Store.findById(data.storeId);
  if (!store) throw new BadRequestError('Store does not exist');

  return Material.create(data);
};

export const getMaterials = async (storeId: string) => {
  const objectStoreId = new mongoose.Types.ObjectId(storeId);
  return Material.find({ storeId: objectStoreId });
};

export const updateMaterial = async (id: string, data: Partial<MaterialInput>) => {
  return Material.findByIdAndUpdate(id, data, { new: true });
};

export const deleteMaterial = async (id: string) => {
  return Material.findByIdAndDelete(id);
};

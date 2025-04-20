import { optional, inject } from 'inversify'
import { isNil } from '../isNil'
import { DatasetService } from './baseDataset'

export class AccumulatingDatasetService<
  T extends any = any,
  QueryDataset extends () => Promise<T> = () => Promise<T>,
  Fallback extends (() => Promise<T> | T) | T = (() => Promise<T> | T) | T,
  GetDeps extends () => unknown = () => unknown
> extends DatasetService<T> {
  // %% constructor %%
  constructor(
    @inject('queryDataset') queryDataset: QueryDataset,
    @inject('mergeData')
    private readonly mergeData: (newData: T, oldData: T) => T,
    @optional() @inject('fallback') fallback?: Fallback,
    @optional() @inject('getDeps') getDeps?: GetDeps,
    @optional() @inject('debounce') debounce: number = 200,
    @optional() @inject('polling') polling?: number
  ) {
    super(queryDataset, fallback, getDeps, debounce, polling)
  }

  private useFallback: boolean = false

  protected override setData(data: T) {
    if (this._data.value && !this.useFallback) {
      this._data.value = this.mergeData(data, this._data.value)
    } else {
      this._data.value = data
    }
  }

  protected canFallback(
    fallback?: T | (() => T | Promise<T>) | undefined
  ): fallback is T | (() => T | Promise<T>) {
    const result = !isNil(fallback) && isNil(this.data)
    if (result) {
      this.useFallback = true
    }
    return result
  }
}

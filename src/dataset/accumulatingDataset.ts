import { isNil } from '../isNil'
import { Dataset, DatasetService } from './baseDataset'

export class AccumulatingDatasetService<
  T extends Dataset = Dataset
> extends DatasetService<T> {
  private useFallback: boolean = false

  protected override setData(data: T) {
    if (this._data.value && !this.useFallback) {
      this._data.value = this._data.value.concat(data) as T
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

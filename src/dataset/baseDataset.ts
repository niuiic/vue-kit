import { ref, watch } from 'vue'
import { inject, optional } from 'inversify'

export type Dataset = any[][]

export class DatasetService<T extends Dataset = Dataset> {
  // %% constructor %%
  constructor(
    @inject('queryDataset') queryDataset: () => Promise<T>,
    @optional() @inject('fallback') fallback?: (() => Promise<T> | T) | T,
    @optional() @inject('getDeps') getDeps?: () => unknown
  ) {
    this.setupQueryFn(queryDataset, fallback, getDeps)
  }

  // %% data %%
  get data(): T | undefined {
    return this._data.value
  }

  protected queryCount = 0
  protected _data = ref<T>()
  protected queryDataset!: () => Promise<unknown>
  protected setupQueryFn(
    queryDataset: () => Promise<T>,
    fallback?: T | (() => Promise<T> | T),
    getDeps?: () => unknown
  ) {
    this.queryDataset = () => {
      this.queryCount += 1
      const curCount = this.queryCount

      this._loading.value = true
      this._loaded = queryDataset()
        .then(
          (data) => curCount === this.queryCount && (this._data.value = data)
        )
        .catch(async () => {
          if (curCount !== this.queryCount || !fallback) {
            return
          }

          if (typeof fallback === 'function') {
            this._data.value = await fallback()
          } else {
            this._data.value = fallback
          }
        })
        .finally(
          () => curCount === this.queryCount && (this._loading.value = false)
        )
      return this._loaded
    }

    this.queryDataset()

    this.setupWatcher(getDeps)
  }
  protected setupWatcher(getDeps?: () => unknown) {
    if (getDeps) {
      watch(
        () => getDeps(),
        () => this.queryDataset(),
        { deep: true }
      )
    }
  }

  // %% loading %%
  protected _loaded: Promise<unknown> | undefined
  protected _loading = ref(false)
  get loading() {
    return this._loading.value
  }
  get loaded() {
    if (!this._loaded) {
      return Promise.resolve(undefined)
    }

    return this._loaded
  }
}

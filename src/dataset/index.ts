import { ref, watch } from 'vue'
import { inject, optional } from 'inversify'

export type Dataset = any[][]

export class DatasetService<T extends Dataset = Dataset> {
  // %% constructor %%
  private readonly queryDataset: () => Promise<unknown>

  constructor(
    @inject('queryDataset') queryDataset: () => Promise<T>,
    @optional()
    @inject('fallback')
    private readonly fallback?: (() => Promise<T> | T) | T,
    @optional() @inject('getDeps') private readonly getDeps?: () => unknown
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
          if (curCount !== this.queryCount || !this.fallback) {
            return
          }

          if (typeof this.fallback === 'function') {
            this._data.value = await this.fallback()
          } else {
            this._data.value = this.fallback
          }
        })
        .finally(
          () => curCount === this.queryCount && (this._loading.value = false)
        )
      return this._loaded
    }

    this.queryDataset()

    if (this.getDeps) {
      watch(
        () => this.getDeps && this.getDeps(),
        () => this.queryDataset(),
        { deep: true }
      )
    }
  }

  // %% data %%
  private queryCount = 0
  private _data = ref<T>()
  get data(): T | undefined {
    return this._data.value
  }

  // %% loading %%
  private _loaded: Promise<unknown> | undefined
  private _loading = ref(false)
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

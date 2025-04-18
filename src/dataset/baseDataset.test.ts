import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatasetService } from './baseDataset'
import { ref } from 'vue'

describe('DatasetService', () => {
  const mockQueryDataset = vi.fn()
  const mockFallback = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  describe('基础功能', () => {
    it('应初始化并立即调用queryDataset', async () => {
      const data = [
        [1, 2],
        [3, 4]
      ]
      mockQueryDataset.mockResolvedValue(data)

      const service = new DatasetService(mockQueryDataset)

      expect(mockQueryDataset).toHaveBeenCalledTimes(1)
      await service.loaded
      expect(service.data).toEqual(data)
      expect(service.loading).toBe(false)
    })

    it('当提供getDeps时应设置watcher', async () => {
      mockQueryDataset.mockResolvedValue([])
      const deps = ref([])

      new DatasetService(mockQueryDataset, undefined, () => deps.value)

      expect(mockQueryDataset).toHaveBeenCalledTimes(1)
      deps.value = []
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(mockQueryDataset).toHaveBeenCalledTimes(2)
    })
  })

  describe('错误处理', () => {
    it('当查询失败时应使用函数式fallback', async () => {
      const fallbackData = [[5, 6]]
      mockQueryDataset.mockRejectedValue(new Error('Failed'))
      mockFallback.mockResolvedValue(fallbackData)

      const service = new DatasetService(mockQueryDataset, mockFallback)
      await service.loaded

      expect(mockFallback).toHaveBeenCalled()
      expect(service.data).toEqual(fallbackData)
    })

    it('当查询失败时应使用静态fallback', async () => {
      const fallbackData = [[7, 8]]
      mockQueryDataset.mockRejectedValue(new Error('Failed'))

      const service = new DatasetService(mockQueryDataset, fallbackData)
      await service.loaded

      expect(service.data).toEqual(fallbackData)
    })

    it('当有新查询时应忽略旧fallback', async () => {
      mockQueryDataset
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([[9, 10]])

      const service = new DatasetService(mockQueryDataset, mockFallback)
      service['queryDataset']()
      await service.loaded

      expect(mockFallback).not.toHaveBeenCalled()
      expect(service.data).toEqual([[9, 10]])
    })
  })

  describe('属性', () => {
    it('应返回正确的loading状态', async () => {
      let resolveQuery: (value: unknown) => void
      mockQueryDataset.mockImplementation(
        () => new Promise((resolve) => (resolveQuery = resolve))
      )

      const service = new DatasetService(mockQueryDataset)
      expect(service.loading).toBe(true)
      resolveQuery!([])
      await service.loaded
      expect(service.loading).toBe(false)
    })

    it('应返回loaded promise', async () => {
      const data = [[11, 12]]
      mockQueryDataset.mockResolvedValue(data)

      const service = new DatasetService(mockQueryDataset)
      await service.loaded
      expect(service.data).toEqual(data)
    })
  })
})

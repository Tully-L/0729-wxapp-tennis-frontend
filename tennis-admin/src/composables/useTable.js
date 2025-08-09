/**
 * Table composable for data management
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

export function useTable(options = {}) {
  const {
    fetchData,
    defaultPageSize = 20,
    defaultSortField = 'created_at',
    defaultSortOrder = 'desc'
  } = options

  // State
  const loading = ref(false)
  const data = ref([])
  const selectedRows = ref([])
  
  const pagination = reactive({
    page: 1,
    limit: defaultPageSize,
    total: 0,
    totalPages: 0
  })

  const filters = reactive({})
  const searchQuery = ref('')
  
  const sorting = reactive({
    field: defaultSortField,
    order: defaultSortOrder
  })

  // Computed
  const hasData = computed(() => data.value.length > 0)
  const hasSelection = computed(() => selectedRows.value.length > 0)
  const isAllSelected = computed(() => {
    return hasData.value && selectedRows.value.length === data.value.length
  })

  // Methods
  const loadData = async (params = {}) => {
    if (!fetchData) {
      console.warn('fetchData function not provided to useTable')
      return
    }

    loading.value = true
    try {
      const requestParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery.value,
        sortField: sorting.field,
        sortOrder: sorting.order,
        ...filters,
        ...params
      }

      const response = await fetchData(requestParams)
      
      if (response.success) {
        data.value = response.data.items || response.data.list || response.data
        pagination.total = response.data.total || 0
        pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
      } else {
        throw new Error(response.error?.message || 'Failed to load data')
      }
    } catch (error) {
      console.error('Failed to load table data:', error)
      ElMessage.error(error.message || 'Failed to load data')
      data.value = []
      pagination.total = 0
      pagination.totalPages = 0
    } finally {
      loading.value = false
    }
  }

  const refresh = () => {
    loadData()
  }

  const handlePageChange = (page) => {
    pagination.page = page
    loadData()
  }

  const handleSizeChange = (size) => {
    pagination.limit = size
    pagination.page = 1
    loadData()
  }

  const handleSortChange = ({ prop, order }) => {
    sorting.field = prop
    sorting.order = order === 'ascending' ? 'asc' : 'desc'
    pagination.page = 1
    loadData()
  }

  const handleSearch = (query) => {
    searchQuery.value = query
    pagination.page = 1
    loadData()
  }

  const handleFilter = (filterData) => {
    Object.assign(filters, filterData)
    pagination.page = 1
    loadData()
  }

  const resetFilters = () => {
    Object.keys(filters).forEach(key => {
      delete filters[key]
    })
    searchQuery.value = ''
    pagination.page = 1
    loadData()
  }

  const handleSelectionChange = (selection) => {
    selectedRows.value = selection
  }

  const selectAll = () => {
    selectedRows.value = [...data.value]
  }

  const clearSelection = () => {
    selectedRows.value = []
  }

  const toggleRowSelection = (row, selected) => {
    if (selected) {
      if (!selectedRows.value.find(item => item.id === row.id)) {
        selectedRows.value.push(row)
      }
    } else {
      const index = selectedRows.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        selectedRows.value.splice(index, 1)
      }
    }
  }

  const getRowById = (id) => {
    return data.value.find(row => row.id === id || row._id === id)
  }

  const updateRow = (id, updates) => {
    const index = data.value.findIndex(row => row.id === id || row._id === id)
    if (index > -1) {
      data.value[index] = { ...data.value[index], ...updates }
    }
  }

  const removeRow = (id) => {
    const index = data.value.findIndex(row => row.id === id || row._id === id)
    if (index > -1) {
      data.value.splice(index, 1)
      pagination.total = Math.max(0, pagination.total - 1)
    }
  }

  const addRow = (row) => {
    data.value.unshift(row)
    pagination.total += 1
  }

  // Export data
  const exportData = (format = 'csv', filename = 'export') => {
    if (!hasData.value) {
      ElMessage.warning('No data to export')
      return
    }

    try {
      let content = ''
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const fullFilename = `${filename}_${timestamp}`

      switch (format.toLowerCase()) {
        case 'csv':
          content = convertToCSV(data.value)
          downloadFile(content, `${fullFilename}.csv`, 'text/csv')
          break
        case 'json':
          content = JSON.stringify(data.value, null, 2)
          downloadFile(content, `${fullFilename}.json`, 'application/json')
          break
        default:
          ElMessage.error('Unsupported export format')
          return
      }

      ElMessage.success('Data exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      ElMessage.error('Export failed')
    }
  }

  // Helper functions
  const convertToCSV = (data) => {
    if (!data.length) return ''

    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    // State
    loading,
    data,
    selectedRows,
    pagination,
    filters,
    searchQuery,
    sorting,

    // Computed
    hasData,
    hasSelection,
    isAllSelected,

    // Methods
    loadData,
    refresh,
    handlePageChange,
    handleSizeChange,
    handleSortChange,
    handleSearch,
    handleFilter,
    resetFilters,
    handleSelectionChange,
    selectAll,
    clearSelection,
    toggleRowSelection,
    getRowById,
    updateRow,
    removeRow,
    addRow,
    exportData
  }
}
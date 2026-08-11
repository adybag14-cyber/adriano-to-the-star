class Pagination {
  constructor(element) { this.element = element; this.totalItems = 0; this.itemsPerPage = 10; this.currentPage = 1; this.maxPages = 5; }
  setTotalItems(total) { this.totalItems = total; this.render(); }
  setItemsPerPage(perPage) { this.itemsPerPage = perPage; this.render(); }
  setCurrentPage(page) { 
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(page, totalPages)); 
    this.render(); 
  }
  nextPage() { this.setCurrentPage(this.currentPage + 1); }
  previousPage() { this.setCurrentPage(this.currentPage - 1); }
  firstPage() { this.setCurrentPage(1); }
  lastPage() { this.setCurrentPage(Math.ceil(this.totalItems / this.itemsPerPage)); }
  getCurrentPage() { return this.currentPage; }
  getTotalPages() { return Math.ceil(this.totalItems / this.itemsPerPage); }
  getStartItem() { return (this.currentPage - 1) * this.itemsPerPage + 1; }
  getEndItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  onPageChange(callback) { this.pageChangeCallback = callback; }
  render() {
    if (!this.element) return;
    const totalPages = this.getTotalPages();
    const start = Math.max(1, this.currentPage - Math.floor(this.maxPages / 2));
    const end = Math.min(totalPages, start + this.maxPages - 1);
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(`<span class="page-item ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`);
    }
    this.element.innerHTML = `
      <div class="pagination">
        <span class="page-item" data-page="first">&laquo;</span>
        <span class="page-item" data-page="prev">&lsaquo;</span>
        ${pages.join('')}
        <span class="page-item" data-page="next">&rsaquo;</span>
        <span class="page-item" data-page="last">&raquo;</span>
      </div>
      <div class="pagination-info">${this.getStartItem()}-${this.getEndItem()} of ${this.totalItems}</div>
    `;
  }
}
window.Pagination = Pagination;
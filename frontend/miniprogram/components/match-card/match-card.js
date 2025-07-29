Component({
  properties: {
    match: {
      type: Object,
      value: {}
    },
    showEntry: {
      type: Boolean,
      value: true
    }
  },
  
  methods: {
    onTap() {
      const matchId = this.data.match._id;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${matchId}`
      });
    },
    
    onRegister(e) {
      e.stopPropagation();
      const matchId = this.data.match._id;
      this.triggerEvent('register', { matchId });
    }
  }
}) 
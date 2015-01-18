class @BookmarksPopup extends BookmarksList

  constructor: (@bookmarks, @options = {}, @flowtipOptions = {}) ->
    super(@bookmarks, @options)
    @parentPopup = @options.parentPopup
    @parentRegion = @options.parentRegion
    @folderId = @options.folderId
    @bookmarkItem = @options.bookmarkItem

  render: (@$target) ->
    @$el = document.createElement("ul")
    @$el.className = "bookmarks-list clearfix"
    @renderBookmarks()

    flowtipOptions = if @parentPopup
      {
        region: @parentRegion || "right"
        topDisabled: true
        leftDisabled: false
        rightDisabled: false
        bottomDisabled: true
        rootAlign: "edge"
        leftRootAlignOffset: 0
        rightRootAlignOffset: -0.1
        targetAlign: "edge"
        leftTargetAlignOffset: 0
        rightTargetAlignOffset: -0.1
        targetOffset: 6
      }
    else
      {
        region: "bottom"
        topDisabled: true
        leftDisabled: true
        rightDisabled: true
        bottomDisabled: false
        rootAlign: "edge"
        rootAlignOffset: 0
        targetAlign: "edge"
        targetAlignOffset: 0
        targetOffset: 1
      }

    @flowtip = new FlowTip(_.extend({
      className: "bookmarks-popup"
      hasTail: false
      rotationOffset: 0
      edgeOffset: 10
      targetOffset: 2
      maxHeight: "#{@maxHeight()}px"
    }, flowtipOptions, @flowtipOptions))

    @flowtip.setTooltipContent(@$el)
    @flowtip.setTarget(@$target)
    @flowtip.show()

    @flowtip.content.addEventListener "scroll", =>
      @hidePopupIfPresent()
    , false

  hide: ->
    @hidePopupIfPresent()
    @flowtip.hide()
    @flowtip.destroy()
    @delegate?.BookmarksPopupDidHideWithBookmarkItem?(@bookmarkItem)

  popupOptions: (bookmarkItem) ->
    {
      parentPopup: this
      parentRegion: if @parentPopup
        @flowtip._region
      folderId: bookmarkItem.bookmarkId
      bookmarkItem: bookmarkItem
      delegate: this
    }

  maxHeight: ->
    if @parentPopup
      document.body.clientHeight - 20 # edgeOffset x 2
    else
      document.body.clientHeight - 41 # bookmarks-bar height + 1px border

  BookmarkItemDidMouseOver: (bookmarkItem) ->
    if bookmarkItem.isFolder()
      if @popup
        @hidePopupIfPresent() if @popup.folderId != bookmarkItem.bookmarkId
      else
        @openFolder(bookmarkItem)
    else
      @hidePopupIfPresent()

    @parentPopup?.BookmarksPopupDidMouseOverItem?(bookmarkItem)

  BookmarkItemDidMouseOut: (bookmarkItem) ->
    if bookmarkItem.isFolder()
      unless @mouseoutTimeout
        @mouseoutTimeout = _.delay =>
          @hidePopupIfPresent()
          @mouseoutTimeout = null
        , 100

  BookmarkItemWillClick: (bookmarkItem) ->
    if @popup && @popup.folderId != bookmarkItem.bookmarkId
      @hidePopupIfPresent()

  BookmarkItemDidClick: (bookmarkItem) ->
    @parentPopup?.BookmarksPopupDidClickItem?(bookmarkItem)

  BookmarksPopupDidMouseOverItem: (bookmarkItem) ->
    if @mouseoutTimeout
        clearTimeout(@mouseoutTimeout)
        @mouseoutTimeout = null

  BookmarksPopupDidClickItem: (bookmarkItem) ->
    if @parentPopup
      @hidePopupIfPresent()
    else
      @hide()

import React, { useMemo, useRef, useState } from 'react'
import { Overlay } from 'react-overlays'

import { Post } from '../../models'
import { DateTime } from '../../presenters'
import { OGCard } from '../../containers'

import Files from './files'

import * as styles from './post.css'
import { AlbumFile } from '../../models'

import {
  EmojiNameKind,
  MentionKind,
  LinkKind,
} from '@linkage-community/bottlemail'

import pictograph = require('pictograph')
import config from '../../../config'
import Avatar from '../../../components/avatar'

const Body: React.FC<{
  bodyNodes: Post['nodes']
  className: string
}> = ({ bodyNodes, className }) => {
  return (
    <div className={className}>
      {bodyNodes.map((node, i) => {
        switch (node.kind) {
          case LinkKind:
            return (
              <a key={i} href={node.raw} target="_blank">
                {(() => {
                  try {
                    return decodeURI(node.value)
                  } catch (_) {
                    return node.value || node.raw
                  }
                })()}
              </a>
            )
          case MentionKind:
            return (
              <span key={i} className={styles.bold}>
                {node.raw}
              </span>
            )
          case EmojiNameKind:
            return (
              <span key={i} title={node.raw}>
                {pictograph.dic[node.value] || node.raw}
              </span>
            )
          default:
            return <React.Fragment key={i}>{node.raw}</React.Fragment>
        }
      })}
    </div>
  )
}

const InReplyTo: React.FC<{
  inReplyToId: number
  inReplyToContent?: React.ReactNode
}> = ({ inReplyToId, inReplyToContent }) => {
  const url = new URL(config.sea)
  url.pathname = `/posts/${inReplyToId}`
  const href = url.href

  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLAnchorElement>(null)
  const [show, setShow] = useState(false)
  const handleClick: React.DOMAttributes<HTMLAnchorElement>['onClick'] = (
    event
  ) => {
    setShow((s) => !s)
    event.preventDefault()
  }
  return (
    <>
      <div ref={container} className={styles.body__inReplyTo}>
        <a
          ref={trigger}
          href={href}
          target="_blank"
          rel="noopener"
          onClick={handleClick}
        >
          {'>>'}
          {inReplyToId}
        </a>
        <Overlay
          container={container}
          target={trigger}
          show={show}
          placement="top-start"
        >
          {({ props }) => (
            <div {...props}>
              <div className={styles.overlay}>{inReplyToContent}</div>
            </div>
          )}
        </Overlay>
      </div>
    </>
  )
}

type PostProps = {
  post: Post
  metaEnabled: boolean
  setModalContent: (albumFile: AlbumFile | null) => void
  inReplyTo: number | null
  inReplyToContent?: React.ReactNode
  setInReplyTo: (n: number | null) => void
}
export default ({
  post,
  post: { author },
  metaEnabled,
  setModalContent,
  inReplyTo,
  inReplyToContent,
  setInReplyTo,
}: PostProps) => {
  return useMemo(
    () => (
      <div className={styles.post}>
        <div className={styles.icon}>
          <Avatar account={post.author} className={styles.icon__img} />
        </div>
        <div className={styles.head}>
          <span
            className={[
              styles.displayName,
              // FIXME: DIRTY!
              author.name.trim().length === 0 ? styles.empty : '',
            ].join(' ')}
          >
            {author.name}
          </span>
          <div className={styles.block}>
            <span className={styles.screenName}>@{author.screenName}</span>
            <span className={styles.right}>
              <button
                className={styles.reply}
                onClick={() => {
                  setInReplyTo(inReplyTo === post.id ? null : post.id)
                }}
              >
                <span
                  className={`uil ${
                    inReplyTo === post.id
                      ? `uil-comment-dots ${styles.reply__rotate}`
                      : 'uil-comment'
                  }`}
                />
              </button>
              <a
                className={styles.time}
                target="_blank"
                href={`${(() => {
                  const u = new URL(config.sea)
                  u.pathname = `/posts/${post.id}`
                  return u.href
                })()}`}
              >
                <DateTime dt={post.createdAt} />
              </a>
            </span>
          </div>
        </div>
        {post.inReplyToId && (
          <InReplyTo
            inReplyToId={post.inReplyToId}
            inReplyToContent={inReplyToContent}
          />
        )}
        <Body bodyNodes={post.nodes} className={styles.body} />
        {0 < post.files.length && (
          <Files albumFiles={post.files} setModalContent={setModalContent} />
        )}
        {post.nodes.map((node, i) => {
          switch (node.kind) {
            case LinkKind:
              return <OGCard key={i} url={node.raw} className={styles.ogcard} />
            default:
              return <React.Fragment key={i} />
          }
        })}
        <div className={`${styles.meta} ${metaEnabled ? styles.enabled : ''}`}>
          via {post.application.name}
          {post.application.isAutomated && (
            <span className={styles.meta__badge}>bot</span>
          )}
        </div>
      </div>
    ),
    [author.name, author.avatarFile && author.avatarFile.id, inReplyTo]
  )
}

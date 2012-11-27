(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))

(defn render [template new-val]
  (dom/replace-node
    (dom/get-element "content")
    (crate/html
      [:div#content
        (template new-val)])))

(defn init [template state]
  (dom/insert-at
    js/document.body
    (dom/element :div {:id "content"})
    0)
  (add-watch state nil
    (fn [k a old-val new-val]
      (render template new-val)))
  (render template @state))
(ns hedgehog.todos
  (:use-macros [hedgehog.macros :only [defo defco defbody]])
  (:require
   [clojure.browser.dom :as dom]
   ;; required so defo macro expansion is included
   [reflex.core :as reflex]
   [hedgehog.core :as hedgehog]))

(defo todos ["buy milk" "eat lunch" "drink milk"])
(defo pending-todo "foo bar")
(defco first-todo (first @todos))
(defco num-todos (count @todos))
(defco title
  (str "Todos" (when-not (zero? @num-todos) (str " (" @num-todos ")"))))

(defn add-todo! [todo] (swap! todos conj todo))

(defn todo-element [todo] [:li.todo todo])

(defn update-pending-todo [val]
  (dom/log "PEND-TODO "  @pending-todo)
  (dom/log "PEND-TODO VAL "  val)
  (reset! pending-todo val))

(defbody body
  [:div#todos
    [:ul
      (map todo-element @todos)
      (when-not (empty? @pending-todo)
        (todo-element @pending-todo))]
    [:input ;;#input
     {:value @pending-todo
      :bind-value (do (dom/log "HI") update-pending-todo)
      :type "text"
      :autofocus "true"}]
   [:input {:value @pending-todo}]
   [:button "Add"]])

;; (def render-map {:input pending-todo})

;;(hedgehog/init! title body render-map)

(hedgehog/init! title body)
(defproject hedgehog "0.1.0-SNAPSHOT"
  :description "web app dsl / cljs playground"
  :url "https://github.com/oskarth/hedgehog"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1450"]]
  :plugins [[lein-cljsbuild "0.2.9"]]
  :source-paths ["src/clj"]
  :cljsbuild {:builds [{:source-path "src/cljs"
                        :compiler {:output-to "resources/public/client.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]})